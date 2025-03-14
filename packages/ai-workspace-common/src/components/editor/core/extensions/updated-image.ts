import Image from '@tiptap/extension-image';

const UpdatedImage = Image.extend({
  name: 'image',
  inline: true,
  group: 'inline',
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: '',
        parseHTML: (element) => {
          const src = element?.getAttribute('src');
          return src ?? '';
        },
        renderHTML: (attributes) => ({
          src: attributes?.src ?? '',
        }),
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },
});

export default UpdatedImage;
