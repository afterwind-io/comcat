# :cat:Comcat

[![Version][version-badge]][npm]
[![License][license-badge]][license]
<!-- ![Downloads][download-badge] -->

> :construction: **Currently WIP. Not for production purpose.** :construction:

Share single connection between multiple browser tabs/windows and more.

## Features

TODO

## Get Started

### Install

``` bash
npm install comcat
```

OR

``` bash
yarn add comcat
```


### Usage

TODO

## How it works

### Pump

一个`pump`对应一个连接，以`category`区分。

如果`pump`的工作模式为`unique`，则系统确保在多页面实例时，同一个`category`下有且仅有一个`pump`保持连接。

### Pipe

TODO

### Data Flow

TODO

## Q&A

> Any plan for IE suppo..

NO.

## Todos

- [x] ~~Move topic filtering of pipe to the worker;~~
- [ ] Only output debug info during dev;
- [ ] 通过全局变量确保用户无法创建多个相同`category`的`pump`
- [ ] 通过心跳检测`pump`所处页面是否已关闭，防止`pump`意外终止没有正确注销的情况

## Lisence

MIT

[version-badge]: https://img.shields.io/npm/v/comcat.svg
[npm]: https://www.npmjs.com/package/comcat
[download-badge]: https://img.shields.io/npm/dt/comcat.svg
[license]: LICENSE
[license-badge]: https://img.shields.io/npm/l/comcat.svg
