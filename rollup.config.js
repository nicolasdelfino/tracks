import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';
import filesize from 'rollup-plugin-filesize';
import { uglify } from 'rollup-plugin-uglify';

export default [
  {
    input: 'src/tracks.js',
    output: {
      name: 'Tracks',
      file: pkg.browser,
      format: 'iife'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        exclude: ['node_modules/**']
      }),
      uglify(),
      filesize()
    ]
  },
  {
    input: 'src/tracks.js',
    output: {
      name: 'Tracks',
      file: pkg.module,
      format: 'es'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        exclude: ['node_modules/**']
      }),
      uglify(),
      filesize()
    ]
  }
];
