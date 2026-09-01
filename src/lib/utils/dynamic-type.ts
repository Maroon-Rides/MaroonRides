const BASELINE_BODY_POINT_SIZE = 17;
const HOST_CHANGE_EVENT = 'dynamictypechange';

function readPreferredBodyPointSize() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;font:-apple-system-body';
  document.documentElement.append(probe);
  const pointSize = Number.parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  return pointSize;
}

function applyBodyPointSize(pointSize: number) {
  if (!Number.isFinite(pointSize) || pointSize <= 0) return;
  document.documentElement.style.setProperty(
    '--dynamic-type-scale',
    String(pointSize / BASELINE_BODY_POINT_SIZE),
  );
}

function supportsDynamicType() {
  return (
    CSS.supports('font', '-apple-system-body') && CSS.supports('-webkit-touch-callout', 'default')
  );
}

export function installDynamicType() {
  if (!supportsDynamicType()) return;

  applyBodyPointSize(readPreferredBodyPointSize());

  // WKWebView resolves -apple-system-body once per load, so AppDelegate observes
  // UIContentSizeCategory.didChangeNotification and dispatches this event with the new size.
  window.addEventListener(HOST_CHANGE_EVENT, (event) => {
    applyBodyPointSize(event.detail.bodyPointSize);
  });
}
