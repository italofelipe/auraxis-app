# Release process — internal beta

This runbook covers the first real internal beta target: TestFlight for iOS
and EAS internal APK for Android. Google Play Internal Testing remains pending
until Play Console and the service account are configured.

## Required secrets

Configure these before creating preview or production builds:

```bash
eas secret:create --scope project --name EXPO_TOKEN --value "<expo-token>" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>" --type string
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_API_KEY --value "<phc-token>" --type string
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value "preview" --type string
```

GitHub Actions also needs `EXPO_TOKEN`. App Store submission needs
`ASC_APP_ID`. Android Play submission remains blocked until Play Console exists.

## Internal build

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

Expected outputs:

- iOS: install via TestFlight once the build is uploaded and processed.
- Android: install the EAS internal APK directly on the Samsung test device.

The current `eas.json` preview profile already uses internal distribution and
Android APK. Do not modify `app.json` or `eas.json` without explicit approval.

## OTA updates

Use OTA only for JavaScript, TypeScript, assets, copy, and feature-flag changes.
Any native dependency, Expo plugin, permission, bundle identifier, build number,
Android manifest, iOS plist, or store capability change needs a new native build.

Preview publish:

```bash
eas update --channel preview --message "internal beta smoke"
```

Production publish after store builds are installed:

```bash
eas update --channel production --message "production hotfix"
```

Channel mapping is still pending native config approval. Until `app.json` /
`eas.json` are explicitly updated with update channels, validate the target
channel in EAS before publishing.

## Rollback

Find the last known-good update:

```bash
eas update:list --channel preview --limit 10
```

Republish the previous JS state or use EAS dashboard rollback for the affected
branch/channel. Record the rollback update ID in the incident note and verify
that the installed preview build receives it after relaunch.

## Internal smoke checklist

- Login, dashboard, monthly period switch, transaction create/delete/restore.
- Goal create and simulation.
- Tools hub opens one calculator.
- Subscription screen opens hosted checkout in preview; store checkout must fail
  safely until StoreKit/Google Play Billing are configured.
- Privacy center toggles analytics opt-out and PostHog stops receiving events.
- Push opt-in screen opens and handles denied/unavailable permission states.
- Deep links: valid private link routes after login; invalid link falls back.
- Sentry receives a test error without PII.
- PostHog receives screen and product events without email/CPF/token/raw amounts.

## Maestro

Local smoke:

```bash
maestro test .maestro/01_login.yaml
maestro test .maestro/02_dashboard_overview.yaml
maestro test .maestro/06_privacy_analytics_opt_out.yaml
maestro test .maestro/07_tool_usage.yaml
maestro test .maestro/08_subscription_checkout_smoke.yaml
maestro test .maestro/09_notification_preferences_smoke.yaml
maestro test .maestro/05_logout.yaml
```

The scheduled CI workflow still needs human-approved workflow changes before it
can fail the build on critical Maestro smoke regressions and add Android
artifacts.
