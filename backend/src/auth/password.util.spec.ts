import { hashPassword, verifyPassword } from './password.util';

describe('password.util', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('CorrectHorseBatteryStaple1');
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword('CorrectHorseBatteryStaple1', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('CorrectHorseBatteryStaple1');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('rejects a malformed hash', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
  });
});
