import { getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';

export const defaultExtensions = [StarterKit, Highlight, TaskList, TaskItem, Link, Image, Markdown];

export const defaultSchema = getSchema(defaultExtensions);
