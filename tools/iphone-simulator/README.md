# iPhone Simulator Safari speech

The `iPhone Simulator Safari speech` Actions workflow runs XCTest taps against
Apple's Safari in an installed iPhone Simulator on a macOS runner. It imports the
real shared speech module, decodes a shipped AAC recording through real Web Audio,
and speaks a new question and two replays through the real iOS English speech
service. One replay follows a background/foreground transition.

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
the workflow commands. The fixture URL is
`http://127.0.0.1:4179/tools/iphone-simulator/speech.html`.

To inspect a retained run without booting another simulator, dispatch the same
workflow with `evidence_run_id` set to that Actions run's numeric ID. The
evidence-only job downloads the same repository's `iphone-safari-speech-evidence`
artifact and re-reads its XCTest summary with the current reporting script. It
retains the parsed summary and original screenshot and explicitly identifies
the original run and outcome. A failed original run remains a failure; reading
its artifact does not constitute a new playback test. Leave `evidence_run_id`
empty to run the normal iPhone Simulator Safari checks.
