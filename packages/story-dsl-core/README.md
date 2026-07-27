# Story DSL Core

This package is the canonical Story DSL parser, compiler, IR model, XML converter, and decompiler for this repository.

It was imported from the `story-dsl-main/packages/core` upstream and replaces the former handwritten browser implementation in `src/Jyxr.ModEditor/wwwroot/story-dsl.js`. The browser file is generated through the editor package:

```sh
cd src/Jyxr.ModEditor
npm run build:story-dsl
```

Make parser or compiler changes here. Do not edit the generated browser bundle directly.
