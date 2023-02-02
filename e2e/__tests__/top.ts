describe("Top page", () => {
  beforeAll(async () => {
    await page.goto(`${TARGET_PAGE_URL}/`);
  });
  test("display UVP [QxVsMj44Kp55FxSxcIrfl]", async () => {
    const heading = await page.$eval(
      "[data-test=heading]",
      el => (el as HTMLElement).innerText
    );
    const paragraph = await page.$eval(
      "[data-test=paragraph]",
      el => (el as HTMLElement).innerText
    );
    expect(heading).toBe("Tweet to the world.\nConnect to the world.");
    expect(paragraph).toBe("Share your favorite moments!");
  });
});
