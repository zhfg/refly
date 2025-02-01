import { getClientOrigin } from '@refly/utils/url';
import { browser } from 'wxt/browser';

export async function getCookie() {
  try {
    const promise = new Promise(async (resolve, reject) => {
      const res = await browser.cookies?.get({
        name: '_rf_access',
        url: getClientOrigin(),
      });

      if (res?.value) {
        resolve(res?.value);
      } else {
        reject('user not auth');
      }
    });

    const res = await promise;

    return res;
  } catch (err) {
    console.log('err', err);
  }
}
