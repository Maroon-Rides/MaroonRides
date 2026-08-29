package com.maroonrides.maroonrides;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // register before super.onCreate() helped load properly
        registerPlugin(LegacyPrefsPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
