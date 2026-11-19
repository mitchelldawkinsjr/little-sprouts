# iPhone Simulator Safari speech

The `iPhone Simulator Safari speech` Actions workflow runs XCTest taps against
Apple's Safari in an installed iPhone Simulator on a macOS runner. It imports the
real shared speech module, decodes a shipped AAC recording through real Web Audio,
and speaks a new question and two replays through the real iOS English speech
service. One replay follows a background/foreground transition.

Both native playback and evidence inspection use the standard
`macos-15-intel` GitHub-hosted runner with `DEVELOPER_DIR` pinned to
`/Applications/Xcode_26.2.app/Contents/Developer`. This keeps XCTest, Safari's
simulator runtime, and the result reader on the same Xcode toolchain rather
than relying on the runner's older default Xcode selection. No larger or paid
runner class is requested.

Three XCTest cases run in order. An isolated `plain.html` control runs first,
before the app's speech module has loaded. It speaks directly during a trusted
tap and then 1500 ms after a second tap using real browser utterances, with no
app priming, cancellation, or selected voice. The delayed control runs only if
the direct control completed, so it cannot wait behind a stalled first utterance.
It navigates to the app fixture
before asserting its results, so a failed system control still permits the
separate included-recording and question/replay checks to run.

The driver retries a physical tap at most three times only while the target
action's initial status is unchanged. Each handler changes that status before
any asynchronous playback, so this never retries a started line. App fixture
page-load checks also reject WebContent reloads rather than hiding them with a
successful retry.

The normal `speech_case: full` run selects only the three `SafariSpeechTests`
cases above. Because the plain control warms Apple's speech service first, a
passing full run does not establish the first app question on a cold service.

An optional manual dispatch with `speech_case: cold-app` creates a fresh iPhone
Simulator and opens the app speech fixture directly. It selects only
`ColdAppSpeechTests`, whose single test taps **Play new question** before any
plain system voice control or included recording. The app's own gesture priming
still runs normally, and the actual delayed question must complete through the
real iOS browser voice. The page-load guard rejects a WebContent reload.
This independent job is named **Native Safari cold app (manual)** and requires
one passing test; it cannot replace the normal three-test **safari-speech**
check. For example:

```sh
gh workflow run iphone-safari.yml --ref <branch> -f speech_case=cold-app
```

Leaving `evidence_run_id` populated always requests evidence inspection only,
regardless of `speech_case`; it does not start a new simulator playback run.

A read-only host preflight captures `system_profiler` audio-device data and
tries a quarter-second output tone with `afplay`, bounded to 15 seconds. A failed
host probe is reported separately and never counts as successful native app
playback. It changes no audio permissions, installs no drivers, and records no
input. The probe JSON is retained to distinguish a missing hosted audio route
from a failure in the app's speech module.

There are no browser API, speech, audio, or gesture stand-ins in this check. The
fixture's Content Security Policy blocks the model worker to force the real
production worker-failure/browser fallback consistently; questions
start 1500 ms after a real tap to exercise iOS's asynchronous speech permission
boundary. Included recordings still use real Web Audio. Missing
simulator runtimes, English voices, playback completion events, or successful
results fail the job. The workflow retains the XCTest result bundle and simulator
screenshot, including on failure. Native XCTest summary JSON and the build log
are retained as well. Failed native test messages are surfaced as GitHub check
annotations, and missing XCTest results are explicitly reported as unverified.

The small XCTest host application only supplies a test runner; it is not a new
Little Sprouts app and requires no signing credentials. The test page contains
fixed test questions and writes diagnostic engine/status results only on that
page.

This verifies the iOS Simulator browser/voice path. It cannot establish physical
iPhone speaker output, volume or silent-switch behavior, Bluetooth routing, or
Home Screen app lifecycle behavior. Those still need a physical iPhone listening
check.

To run on a Mac with Xcode, XcodeGen, and an available iPhone Simulator, follow
the workflow commands. Start at `http://127.0.0.1:4179/tools/iphone-simulator/plain.html`
for the combined checks. The app speech fixture URL is
`http://127.0.0.1:4179/tools/iphone-simulator/speech.html`.

To inspect a retained run without booting another simulator, dispatch the same
workflow with `evidence_run_id` set to that Actions run's numeric ID. The
evidence-only job downloads the same repository's `iphone-safari-speech-evidence`
artifact and re-reads its XCTest summary with the current reporting script. It
retains the parsed summary and original screenshot and explicitly identifies
the original run and outcome. A failed original run remains a failure; reading
its artifact does not constitute a new playback test. Leave `evidence_run_id`
empty to run the normal iPhone Simulator Safari checks.
