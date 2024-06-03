import * as requestModule from '@refly/openapi-schema';
import { sendToBackgroundV2 } from '@/utils/extension/messaging';

const proxiedRequestModule = new Proxy(requestModule, {
  get(target, propKey, receiver) {
    const origMethod = target[propKey as keyof typeof requestModule];

    if (typeof origMethod === 'function') {
      // The return function type is unknown because we don't know the exact signature of each function
      return async function (thisArg: unknown, ...args: unknown[]) {
        console.log(`Calling function ${String(propKey)} with arguments: ${args}`);

        try {
          const res = await sendToBackgroundV2({
            name: String(propKey),
            type: 'apiRequest',
            target,
            thisArg,
            args,
          });

          return res;
        } catch (err) {
          return {
            success: false,
            errMsg: err,
          };
        }
      };
    }

    // If it's not a function, return the property as is
    return origMethod;
  },
});

export default proxiedRequestModule;
