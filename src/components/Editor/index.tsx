'use client'; // This is a client component 👈🏽
import React, { useEffect, useRef, useState } from 'react';

import { createEditor, createWorkspaceOptions } from './utils';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import { useMount, useUpdate, useUpdateEffect } from 'ahooks';
import type { Page } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import '@blocksuite/editor/themes/affine.css';
import { presetMarkdown } from './data';
import { PageBlockModel, getDefaultPage } from '@blocksuite/blocks';
export interface IEditorProps {
  className?: string;
}

const options = createWorkspaceOptions();
const pageId = 'step-article-page';
const Editor: React.FC<IEditorProps> = (props) => {
  const { className } = props;

  const [displayMarkdown, setDisplayMarkdown] = useState('');
  const [canEditor, setCanEditor] = useState<boolean>(false);

  useEffect(() => {
    // 获取浏览器参数
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const init = searchParams.get('init');

    if (init === 'streaming') {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayMarkdown(presetMarkdown.substring(0, i));
        i++;
        if (i > presetMarkdown.length) {
          setCanEditor(true);
          clearInterval(interval);
        }
      }, 10);
      return () => clearInterval(interval);
    } else {
      setCanEditor(true);
      setDisplayMarkdown(presetMarkdown);
    }
  }, []);

  const ref = useRef<HTMLDivElement>(null);

  const workspaceRef = useRef<Workspace>(null!);
  const pageRef = useRef<Page>(null!);

  const pageBlockIdRef = useRef<string>('');
  const contentParserRef = useRef<ContentParser>(null!);
  const [frameId, setFrameId] = useState<string>('');

  // 初始化workspace、page
  useMount(() => {
    if (
      ref.current &&
      !workspaceRef.current &&
      !pageRef.current &&
      !pageBlockIdRef.current
    ) {
      const workspace = new Workspace(options)
        .register(AffineSchemas)
        .register(__unstableSchemas);
      const page = workspace.createPage({ id: pageId });
      const contentParser = new ContentParser(page);
      createEditor(page, ref.current);
      pageRef.current = page;
      workspaceRef.current = workspace;

      contentParserRef.current = contentParser;
    }
  });

  useEffect(() => {
    if (!pageRef.current) {
      return;
    }
    if (!pageBlockIdRef.current) {
      const _pageBlockId = pageRef.current.addBlock('affine:page', {
        title: new Text('Wel'),
      });
      pageBlockIdRef.current = _pageBlockId;
    }
  }, []);

  useUpdateEffect(() => {
    if (!pageRef.current) {
      return;
    }
    if (frameId) {
      const block = pageRef.current.getBlockById(frameId);
      if (block) {
        pageRef.current.deleteBlock(block);
      }
    }
    const newFrameId = pageRef.current.addBlock(
      'affine:frame',
      {},
      pageBlockIdRef.current
    );
    contentParserRef.current
      .importMarkdown(displayMarkdown, newFrameId)
      .then(() => {
        setFrameId(newFrameId);
      });
  }, [displayMarkdown]);

  const onChangeTitle = () => {
    if (pageBlockIdRef.current) {
      const block = pageRef.current.getBlockById(
        pageBlockIdRef.current
      ) as PageBlockModel;
      if (block) {
        const pageComponent = getDefaultPage(pageRef.current);

        /* 重置title且失焦 */
        if (pageComponent) {
          pageComponent.titleVEditor.setText('new title123');
          setTimeout(() => {
            pageComponent.titleVEditor.rootElement.blur();
          }, 10);
        }
      }
    }
  };

  return (
    <>
      <div
        ref={ref}
        className={`h-[90vh] w-full editor-wrap ${
          canEditor ? '' : 'pointer-events-none'
        }`}
      />
      <div className="flex w-full">
        <button onClick={onChangeTitle}>change title</button>
      </div>
    </>
  );
};

export default Editor;
