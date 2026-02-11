export async function mockCaptcha(context: any) {
  await context.addInitScript(() => {
    (window as any).grecaptcha = {
      ready: (cb: any) => cb(),
      execute: () => Promise.resolve('test-token'),
      render: () => {}
    };
  });
}
