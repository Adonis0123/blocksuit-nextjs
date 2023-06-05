'use client'; // This is a client component 👈🏽
import React, { useEffect, useRef, useState } from 'react';

import { addShapeElement, createEditor, createWorkspaceOptions } from './utils';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import { useMount, useUpdateEffect } from 'ahooks';
import type { Page } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '@blocksuite/blocks';
import { StrokeStyle } from '@blocksuite/phasor';
import '@blocksuite/editor/themes/affine.css';
import { presetMarkdown } from './data';
export interface IEditorProps {
  className?: string;
}

const options = createWorkspaceOptions();
const pageId = 'step-article-page';
const Editor: React.FC<IEditorProps> = (props) => {
  const { className } = props;

  const [displayMarkdown, setDisplayMarkdown] = useState('');
  const [canEditor, setCanEditor] = useState<boolean>(false);

  useEffect(()=>{
    console.log(crypto.subtle,'crypto.subtle')
  },[])

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
        title: new Text('Welcome to BlockSuite Playground'),
      });
      const surfaceBlockId = pageRef.current.addBlock(
        'affine:surface',
        {},
        _pageBlockId
      );
      addShapeElement(pageRef.current, surfaceBlockId, {
        id: '0',
        index: 'a0',
        type: 'shape',
        xywh: '[0,-100,100,100]',
        seed: Math.floor(Math.random() * 2 ** 31),
        shapeType: 'rect',
        radius: 0,
        filled: false,
        fillColor: DEFAULT_SHAPE_FILL_COLOR,
        strokeWidth: 4,
        strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
        strokeStyle: StrokeStyle.Solid,
        roughness: 2,
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

  return (
    <div
      ref={ref}
      className={`h-[90vh] w-full editor-wrap ${
        canEditor ? '' : 'pointer-events-none'
      }`}
    />
  );
};

export default Editor;
