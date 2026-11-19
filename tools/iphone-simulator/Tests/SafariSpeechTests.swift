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

    func testIncludedRecordingInSafari() throws {
        expect("Speech fixture ready")
        expect("English voice ready")

        tap("Play included recording")
        expect("Recording passed")
    }

    func testRealEnglishQuestionsAndReplayInSafari() throws {
        expect("Speech fixture ready")
        expect("English voice ready")

        tap("Play new question")
        expect("Question passed")

        tap("Hear it again")
        expect("Replay passed")

        XCUIDevice.shared.press(.home)
        safari.activate()
        tap("Hear it again")
        expect("Replay after background passed")
    }
}
