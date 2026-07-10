const { withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// TAMU's server ships an incomplete cert chain (missing intermediate), which
// Android's OkHttp rejects as "unable to find valid certification path" and RN
// surfaces as "TypeError: Network request failed". We can't fix the upstream
// server, so we bypass TLS validation for that single host. Everything else
// (including the auth.maroonrides.app token flow) keeps full validation.
const INSECURE_HOST = 'aggiespirit.ts.tamu.edu';

const kotlin = (pkg) => `package ${pkg}

import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.OkHttpClient
import java.security.KeyStore
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

object MaroonHttpConfig {
  private const val INSECURE_HOST = "${INSECURE_HOST}"

  fun install() {
    val defaultTrustManager = defaultTrustManager()

    val trustManager = object : X509TrustManager {
      override fun checkClientTrusted(chain: Array<out X509Certificate>, authType: String) =
        defaultTrustManager.checkClientTrusted(chain, authType)

      override fun checkServerTrusted(chain: Array<out X509Certificate>, authType: String) {
        try {
          defaultTrustManager.checkServerTrusted(chain, authType)
        } catch (e: CertificateException) {
          if (!leafClaimsHost(chain.firstOrNull(), INSECURE_HOST)) throw e
        }
      }

      override fun getAcceptedIssuers(): Array<X509Certificate> =
        defaultTrustManager.acceptedIssuers
    }

    val sslContext = SSLContext.getInstance("TLS")
    sslContext.init(null, arrayOf<TrustManager>(trustManager), null)

    val defaultVerifier = HttpsURLConnection.getDefaultHostnameVerifier()

    OkHttpClientProvider.setOkHttpClientFactory(object : OkHttpClientFactory {
      override fun createNewNetworkModuleClient(): OkHttpClient =
        OkHttpClientProvider.createClientBuilder()
          .sslSocketFactory(sslContext.socketFactory, trustManager)
          .hostnameVerifier { hostname, session ->
            hostname == INSECURE_HOST || defaultVerifier.verify(hostname, session)
          }
          .build()
    })
  }

  private fun defaultTrustManager(): X509TrustManager {
    val tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    tmf.init(null as KeyStore?)
    return tmf.trustManagers.first { it is X509TrustManager } as X509TrustManager
  }

  private fun leafClaimsHost(cert: X509Certificate?, host: String): Boolean {
    if (cert == null) return false
    cert.subjectAlternativeNames?.forEach { entry ->
      val value = entry.getOrNull(1) as? String ?: return@forEach
      if (value.equals(host, ignoreCase = true)) return true
    }
    return cert.subjectDN?.name?.contains("CN=$host", ignoreCase = true) == true
  }
}
`;

const withInsecureHost = (config) => {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) throw new Error('withInsecureHost: android.package is not set');

      const dir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java',
        pkg.replace(/\./g, '/'),
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'MaroonHttpConfig.kt'), kotlin(pkg));
      return cfg;
    },
  ]);

  config = withMainApplication(config, (cfg) => {
    const src = cfg.modResults.contents;
    const anchor = 'SoLoader.init(this, OpenSourceMergedSoMapping)';

    if (!src.includes('MaroonHttpConfig.install()')) {
      cfg.modResults.contents = src.replace(
        anchor,
        `${anchor}\n    MaroonHttpConfig.install()`,
      );
    }
    return cfg;
  });

  return config;
};

module.exports = withInsecureHost;
