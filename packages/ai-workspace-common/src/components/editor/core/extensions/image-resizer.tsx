import { useCurrentEditor } from '@tiptap/react';
import type { FC } from 'react';
import { Spin } from '@arco-design/web-react';
import { lazy, Suspense, useEffect, useState } from 'react';

// Dynamically import Moveable
const Moveable = lazy(() => import('react-moveable'));

export const ImageResizer: FC = () => {
  const { editor } = useCurrentEditor();
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  const updateSelectedImage = () => {
    const imageNode = document.querySelector(
      '.ProseMirror-selectednode',
    ) as HTMLImageElement | null;

    if (imageNode && imageNode.tagName === 'IMG') {
      setSelectedImage(imageNode);
    } else {
      setSelectedImage(null);
    }
  };

  useEffect(() => {
    if (!editor) return;

    updateSelectedImage();

    editor.on('selectionUpdate', updateSelectedImage);
    editor.on('focus', updateSelectedImage);

    const handleClick = (event: MouseEvent) => {
      console.log('click image');
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' && editor) {
        const pos = editor.view.posAtDOM(target, 0);
        if (pos) {
          editor.commands.setNodeSelection(pos);
          updateSelectedImage();
        }
      }
    };

    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      editorElement.addEventListener('click', handleClick);
    }

    return () => {
      editor.off('selectionUpdate', updateSelectedImage);
      editor.off('focus', updateSelectedImage);

      if (editorElement) {
        editorElement.removeEventListener('click', handleClick);
      }
    };
  }, [editor]);

  if (!editor?.isActive('image') || !selectedImage) return null;

  const updateMediaSize = () => {
    if (!selectedImage) return;

    try {
      const selection = editor.state.selection;
      const width = Number(selectedImage.style.width.replace('px', '')) || selectedImage.width;
      const height = Number(selectedImage.style.height.replace('px', '')) || selectedImage.height;

      const setImage = editor.commands.setImage as (options: {
        src: string;
        width: number;
        height: number;
        alt?: string;
        title?: string;
      }) => boolean;

      const imagePos = editor?.state.selection.from;
      const imageNode = imagePos ? editor?.state.doc.nodeAt(imagePos) : null;
      const nodeAttrs = imageNode?.attrs ?? {};

      setImage({
        ...nodeAttrs,
        src: selectedImage.src,
        width: width,
        height: height,
        alt: selectedImage.alt ?? nodeAttrs.alt ?? '',
        title: selectedImage.title ?? nodeAttrs.title ?? '',
      });

      editor?.commands.setNodeSelection(selection.from);

      updateSelectedImage();
    } catch (error) {
      console.error('Error updating image size:', error);
    }
  };

  return (
    <Suspense fallback={<Spin />}>
      <Moveable
        key={`moveable-${selectedImage?.src}-${selectedImage?.width}-${selectedImage?.height}`}
        target={selectedImage}
        container={null}
        origin={false}
        /* Resize event edges */
        edge={false}
        throttleDrag={0}
        /* When resize or scale, keeps a ratio of the width, height. */
        keepRatio={true}
        /* resizable*/
        /* Only one of resizable, scalable, warpable can be used. */
        resizable={true}
        throttleResize={0}
        onResize={({ target, width, height, delta }) => {
          if (delta[0]) target.style.width = `${width}px`;
          if (delta[1]) target.style.height = `${height}px`;
        }}
        onResizeEnd={() => {
          updateMediaSize();
        }}
        /* scalable */
        /* Only one of resizable, scalable, warpable can be used. */
        scalable={true}
        throttleScale={0}
        /* Set the direction of resizable */
        renderDirections={['nw', 'ne', 'se', 'sw']}
        onScale={({ target, transform }) => {
          target.style.transform = transform;
        }}
        onScaleEnd={() => {
          updateMediaSize();
        }}
      />
    </Suspense>
  );
};
