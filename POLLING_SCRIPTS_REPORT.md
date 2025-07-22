# Scripts with Frequent Polling or Continuous Monitoring

## Currently Used Scripts (in main.py)

### ✅ Already Optimized:
1. **efficient_quality_filter.js** - Uses event delegation, only activates on click
   - setTimeout: 100ms, 300ms (only after user interaction)

2. **logo_hider_efficient.js** - CSS-only solution (replaced persistent_logo_hider.js)

3. **flow_ui_hider_minimal.js** - CSS-only solution (replaced aggressive version)

4. **home_button_static.js** - One-time injection (replaced observer version)

5. **upload_monitor_multiport.js** - 3 second minimum between checks

### ⚠️ Scripts That Need Review:
1. **flow_ui_hider_fixed.js** - Has setTimeout(2000) but might not be needed
2. **refresh_blocker.js** - Has multiple setTimeout(100) calls

## Unused Scripts with Polling Issues (NOT loaded)

### 🚫 High-Frequency Polling (< 500ms):
1. **flow_mode_selector_v2.js** - setTimeout(100ms) in polling loop
2. **quality_filter.js** - setTimeout(10ms) + MutationObserver
3. **react_mode_changer.js** - setTimeout(100ms) + MutationObserver
4. **step_by_step_mode_changer.js** - setTimeout(200ms) + MutationObserver
5. **button_replacer.js** - setTimeout(100ms) + setInterval(2000ms)

### 🚫 Continuous Monitoring:
1. **persistent_logo_hider.js** - MutationObserver + setInterval(1000ms)
2. **flow_ui_hider_aggressive.js** - MutationObserver + multiple setTimeout
3. **home_button_injector.js** - MutationObserver (continuous)
4. **home_button_injector_safe.js** - MutationObserver (continuous)
5. **download_interceptor.js** - MutationObserver
6. **api_interceptor.js** - MutationObserver
7. **storage_url_monitor.js** - MutationObserver

### 🚫 Regular Polling (1-2 seconds):
1. **auto_upload_handler.js** - setInterval(2000ms)
2. **silent_upload_handler.js** - setInterval(2000ms)
3. **dynamic_upload_handler.js** - setInterval(2000ms)
4. **upload_dialog_bridge.js** - setInterval(2000ms)

## Recommendations

### Immediate Actions:
1. ✅ Most problematic scripts are already NOT being used
2. ✅ Critical scripts have been optimized (logo hider, UI hider, quality filter)

### Further Optimizations:
1. Consider removing flow_ui_hider_fixed.js if flow_ui_hider_minimal.js works well
2. Review if refresh_blocker.js setTimeout(100) calls are necessary

### Scripts to Delete (not used):
- persistent_logo_hider.js
- flow_ui_hider_aggressive.js
- flow_mode_selector_v2.js
- quality_filter.js
- quality_filter_v2.js
- home_button_injector.js
- home_button_injector_safe.js
- All unused monitoring scripts

## Current Performance Status
- ✅ No high-frequency polling scripts are loaded
- ✅ No MutationObservers for UI hiding
- ✅ Minimal setTimeout usage
- ✅ Event delegation used where possible