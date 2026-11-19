import XCTest

final class SafariSpeechTests: XCTestCase {
    private let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")

    override func setUpWithError() throws {
        continueAfterFailure = false
        safari.activate()
        // New simulator runtimes can show Safari's first-run welcome sheet.
        for _ in 0..<3 {
            for label in ["Continue", "Not Now", "Start Using Safari"] {
                let button = safari.buttons[label]
                if button.waitForExistence(timeout: 1) { button.tap() }
            }
        }
    }

    override func tearDownWithError() throws {
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        screenshot.name = "iPhone Safari speech result"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    private func expect(_ label: String, timeout: TimeInterval = 45,
                        file: StaticString = #filePath, line: UInt = #line) {
        if !safari.webViews.staticTexts[label].waitForExistence(timeout: timeout) {
            let observed = safari.webViews.staticTexts.allElementsBoundByIndex
                .map { $0.label }.joined(separator: "\n")
            XCTFail("Missing Safari speech result: \(label)\nObserved page text:\n\(observed)\nFull hierarchy:\n\(safari.debugDescription)",
                    file: file, line: line)
        }
    }

    private func tap(_ label: String, file: StaticString = #filePath, line: UInt = #line) {
        let button = safari.webViews.buttons[label]
        XCTAssertTrue(button.waitForExistence(timeout: 15), "Missing button: \(label)", file: file, line: line)
        XCTAssertTrue(button.isHittable, "Safari button is not hittable: \(label)", file: file, line: line)
        button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    private func tap(_ label: String, replacing initialText: String,
                     file: StaticString = #filePath, line: UInt = #line) {
        // Safari can consume a focus/toolbar tap without synthesizing a click.
        // Retry only while the action's synchronous status is still untouched;
        // once speech starts, never tap again or replay a partially heard line.
        let initial = safari.webViews.staticTexts[initialText]
        XCTAssertTrue(initial.exists, "Unexpected state before tapping \(label): \(initialText)", file: file, line: line)
        for _ in 0..<3 {
            tap(label, file: file, line: line)
            let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: initial)
            if XCTWaiter.wait(for: [changed], timeout: 3) == .completed { return }
        }
        let observed = safari.webViews.staticTexts.allElementsBoundByIndex
            .map { $0.label }.joined(separator: "\n")
        XCTFail("Safari tap did not activate \(label). Observed page text:\n\(observed)", file: file, line: line)
    }

    func test0PlainSystemVoiceControl() throws {
        expect("Native control ready")
        tap("Speak directly", replacing: "Direct voice not checked")
        let directFinished = safari.webViews.staticTexts.matching(NSPredicate(
            format: "label BEGINSWITH 'Direct voice ' AND (label CONTAINS 'passed' OR label CONTAINS 'failed' OR label CONTAINS 'timed out')"
        )).firstMatch.waitForExistence(timeout: 25)
        let directPassed = safari.webViews.staticTexts["Direct voice passed"].exists

        var delayedFinished = false
        var delayedPassed = false
        if directFinished && directPassed {
            tap("Speak after delay", replacing: "Delayed voice not checked")
            delayedFinished = safari.webViews.staticTexts.matching(NSPredicate(
                format: "label BEGINSWITH 'Delayed voice ' AND (label CONTAINS 'passed' OR label CONTAINS 'failed' OR label CONTAINS 'timed out')"
            )).firstMatch.waitForExistence(timeout: 25)
            delayedPassed = safari.webViews.staticTexts["Delayed voice passed"].exists
        }
        let observed = safari.webViews.staticTexts.allElementsBoundByIndex
            .map { $0.label }.joined(separator: "\n")

        // Always navigate before asserting so a failed system control cannot
        // prevent the separate app recording/question tests from running.
        tap("Open app speech check", replacing: "Native control ready")
        expect("Speech fixture ready")
        XCTAssertTrue(directFinished && directPassed && delayedFinished && delayedPassed,
                      "Plain native Safari voice failed. Observed control page:\n\(observed)")
    }

    func testIncludedRecordingInSafari() throws {
        expect("Speech fixture ready")
        expect("English voice ready")
        expect("Fixture page loads: 1")

        tap("Play included recording", replacing: "Recording not checked")
        expect("Recording passed")
        expect("Fixture page loads: 1")
    }

    func testRealEnglishQuestionsAndReplayInSafari() throws {
        expect("Speech fixture ready")
        expect("English voice ready")
        expect("Fixture page loads: 1")

        tap("Play new question", replacing: "Question not checked")
        expect("Question passed")

        tap("Hear it again", replacing: "Replay not checked")
        expect("Replay passed")

        XCUIDevice.shared.press(.home)
        safari.activate()
        tap("Hear it again", replacing: "Replay passed")
        expect("Replay after background passed")
        expect("Fixture page loads: 1")
    }
}
