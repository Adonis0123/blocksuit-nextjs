'use client'; // This is a client component 👈🏽
import React, { useEffect, useRef, useState } from 'react';

import { addShapeElement, createEditor, createWorkspaceOptions } from './utils';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import { useAsyncEffect, useGetState, useThrottleEffect } from 'ahooks';
import type { Page } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '@blocksuite/blocks';
import { StrokeStyle } from '@blocksuite/phasor';
import '@blocksuite/editor/themes/affine.css';
export interface IEditorProps {
  className?: string;
}

const presetMarkdown = `This playground is designed to:

* 📝 Test basic editing experience.
* ⚙️ Serve as E2E test entry.
* 🔗 Demonstrate how BlockSuite reconciles real-time collaboration with [local-first](https://martin.kleppmann.com/papers/local-first.pdf) data ownership.

## Controlling Playground Data Source
You might initially enter this page with the \`?init\` URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you'll connect to a random single-user room via a WebRTC provider by default. This is the "single-user mode" for local testing.;

> Note that the second and subsequent users should not open the page with the \`?init\` param in this case. Also, due to the P2P nature of WebRTC, as long as there is at least one user connected to the room, the content inside the room will **always** exist.
`;

const options = createWorkspaceOptions();
const pageId = 'step-article-page';
const Editor: React.FC<IEditorProps> = (props) => {
  const { className } = props;

  const [displayMarkdown, setDisplayMarkdown] = useState('');
  const [displayMarkdownList, setDisplayMarkdownList, getDisplayMarkdownList] =
    useGetState<string[]>([]);

  const [canEditor, setCanEditor] = useState<boolean>(false);

  useEffect(() => {
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
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<Workspace>(null!);
  const [page, setPage] = useState<Page>(null!);
  const [pageBlockId, setPageBlockId] = useState<string>('');
  const [contentParser, setContentParser] = useState<ContentParser>(null!);
  const [frameId, setFrameId] = useState<string>('');
  useAsyncEffect(async () => {
    if (ref.current && !workspace && !page) {
      const workspace = new Workspace(options)
        .register(AffineSchemas)
        .register(__unstableSchemas);
      const page = workspace.createPage({ id: pageId });
      // Add page block and surface block at root level
      const pageBlockId = page.addBlock('affine:page', {
        title: new Text('Welcome to BlockSuite Playground'),
      });

      const surfaceBlockId = page.addBlock('affine:surface', {}, pageBlockId);
      setPageBlockId(pageBlockId);
      // Add frame block inside page block
      // const frameId = page.addBlock('affine:frame', {}, pageBlockId);
      // Import preset markdown content inside frame block
      const contentParser = new ContentParser(page);
      addShapeElement(page, surfaceBlockId, {
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
      // contentParser.importMarkdown(presetMarkdown, frameId);
      createEditor(page, ref.current);
      setPage(page);
      setWorkspace(workspace);
      setContentParser(contentParser);
      // console.log(page.root,'page')
    }
  }, []);

  useThrottleEffect(
    () => {
      if (!page) {
        return;
      }
      if (frameId) {
        const block = page.getBlockById(frameId);
        if (block) {
          page.deleteBlock(block);
        }
      }
      const newFrameId = page.addBlock('affine:frame', {}, pageBlockId);
      contentParser.importMarkdown(displayMarkdown, newFrameId);
      setFrameId(newFrameId);
    },
    [displayMarkdown, page, pageBlockId],
    {
      wait: 0,
    }
  );

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
