---
'@worldcoin/minikit-js': minor
---

Add optional `client_name` (`'world_app' | 'world_id_app'`) and `client_version` to the `window.WorldApp` payload and expose them on `MiniKit.deviceProperties` as `clientName` / `clientVersion`. This lets mini apps and MiniKit branch on which host app is running them instead of overloading `world_app_version`. Both fields are optional and absent on older hosts; callers must fall back to `world_app_version`.
