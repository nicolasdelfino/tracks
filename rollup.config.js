import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';
import filesize from 'rollup-plugin-filesize';
import { uglify } from 'rollup-plugin-uglify';

export default [
  // browser-friendly UMD build
  {
    input: 'src/main.js',
    output: {
      name: 'tracks',
      file: pkg.browser,
      format: 'umd'
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

/*
,
  {
    input: 'src/main.js',
    output: {
      name: 'tracks',
      file: pkg.main,
      format: 'cjs'
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
    input: 'src/main.js',
    output: {
      name: 'tracks',
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
*/
