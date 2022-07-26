import { patch } from 'virtual-dom';
import vdomFromJson from 'vdom-as-json/fromJson';

const scriptParams = ((params: URLSearchParams) => ({
  prefix: params.get('prefix')!,
  template: params.get('template')!,
}))(
  new URL((document.currentScript! as HTMLScriptElement).src).searchParams
);

const source = new window.EventSource(`/${ scriptParams.prefix }/lazy-html-plugin/__events?template=${ encodeURIComponent(scriptParams.template) }`);

type DocumentData = string;

type PatchData = {
  head: any;
  body: any;
};

type Message =
| { type: 'init', payload: { document: DocumentData } }
| { type: 'patch', payload: { patch: PatchData } };

let isInitialized = false;

source.addEventListener('message', event => {
  if (event.data === '\uD83D\uDC93') {
    console.log('heartbeat');

    return;
  }

  const message = JSON.parse(event.data) as Message;

  switch (message.type) {
    case 'init':
      if (isInitialized) {
        window.location.reload();
        console.log('Received new initial document. Reloading');
        return;
      }
      document.documentElement.innerHTML = message.payload.document;
      isInitialized = true;
      break;

    case 'patch':
      try {
        patch(document.head, vdomFromJson(message.payload.patch.head));
        patch(document.body, vdomFromJson(message.payload.patch.body));
      } catch (e) {
        console.error(e);
        console.log('Error while patching dom. Reloading');
        window.location.reload();
      }
      break;
  }
});
