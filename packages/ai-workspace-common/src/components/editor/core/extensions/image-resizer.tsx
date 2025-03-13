import { useCurrentEditor } from '@tiptap/react';
import type { FC } from 'react';
import { Spin } from '@arco-design/web-react';
import { lazy, Suspense, useEffect, useState } from 'react';

// Dynamically import Moveable
const Moveable = lazy(() => import('react-moveable'));

export const ImageResizer: FC = () => {
  const { editor } = useCurrentEditor();
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!editor) return;

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

    updateSelectedImage();

    editor.on('selectionUpdate', updateSelectedImage);
    editor.on('focus', updateSelectedImage);

    const handleClick = (event: MouseEvent) => {
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
      }) => boolean;

      setImage({
        src: selectedImage.src,
        width: width,
        height: height,
      });

      editor.commands.setNodeSelection(selection.from);
    } catch (error) {
      console.error('Error updating image size:', error);
    }
  };

  return (
    <Suspense fallback={<Spin />}>
      <Moveable
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
