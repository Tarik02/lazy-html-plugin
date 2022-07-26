
import * as htmlToVdom from 'html-to-vdom';
import * as vdomToJson from 'vdom-as-json/toJson';
import * as vdomToHtml from 'vdom-to-html';
import { h, diff } from 'virtual-dom';
import * as VNode from 'virtual-dom/vnode/vnode';
import * as VText from 'virtual-dom/vnode/vtext';

export type VirtualDocument = {
  head: any;
  body: any;
};

export type DocumentData = string;

export type PatchData = {
  head: any;
  body: any;
};

export type TemplateListener = (document: DocumentData, patch: PatchData | null) => void;

export class Template {
  protected currentDocument: VirtualDocument | undefined;
  protected currentDocumentData: DocumentData | undefined;
  protected listeners = new Set<TemplateListener>();

  listen(callback: TemplateListener, initial: boolean = false): () => void {
    this.listeners.add(callback);

    if (initial && this.currentDocumentData !== undefined) {
      Promise.resolve(this.currentDocumentData)
        .then(data => callback(data, null))
        .catch(console.error);
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(content: string): void {
    const $root = htmlToVdom({ VNode, VText })(`<root>${ content }</root>`);

    const $html = $root.children?.find(el => el.tagName?.toLowerCase() === 'html') ?? $root;

    const newDocument = {
      head: $html.children?.find(el => el.tagName?.toLowerCase() === 'head') ?? h('head', [' ']),
      body: $html.children?.find(el => el.tagName?.toLowerCase() === 'body') ?? (
        $html.children?.find(el => el.tagName?.toLowerCase() === 'head') ?
          h('body', [' ']) :
          h('body', $html.children)
      ),
    };

    this.currentDocumentData = `<!doctype html>${ vdomToHtml($html) }`;

    newDocument.head.children = newDocument.head?.children?.filter(el => el.tagName?.toLowerCase() !== 'script');
    newDocument.body.children = newDocument.body?.children?.filter(el => el.tagName?.toLowerCase() !== 'script');

    const patch = this.currentDocument !== undefined ?
      {
        head: vdomToJson(diff(this.currentDocument.head, newDocument.head)),
        body: vdomToJson(diff(this.currentDocument.body, newDocument.body)),
      } :
      null;

    this.currentDocument = newDocument;

    for (const listener of this.listeners) {
      listener(this.currentDocumentData!, patch);
    }
  }
}
