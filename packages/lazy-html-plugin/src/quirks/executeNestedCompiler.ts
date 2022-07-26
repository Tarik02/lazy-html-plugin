import * as Webpack from 'webpack';

export const executeNestedCompiler = async (
  name: string,
  compilation: Webpack.Compilation,
  callback: (child: Webpack.Compiler) => Promise<void> | void,
): Promise<[Webpack.Chunk[], Webpack.Compilation]> => {
  // Create a new child compiler
  const child = compilation.createChildCompiler(
    name,
    compilation.options.output,
  );
  // Assign context and filesystems
  child.context = compilation.compiler.context;
  child.inputFileSystem = compilation.compiler.inputFileSystem;
  child.outputFileSystem = compilation.compiler.outputFileSystem;

  await callback(child);

  // Initialize plugin
  child.hooks.initialize.call();

  // Run nested compilation
  const [entries, childCompilation] = await new Promise<[Webpack.Chunk[], Webpack.Compilation]>(
    (resolve, reject) => child.runAsChild((err, entries, childCompilation) => {
      if (err) {
        reject(err);
      } else {
        resolve([entries!, childCompilation!]);
      }
    })
  );

  // Move errors info to parent compilation
  compilation.errors.push(
    ...childCompilation.errors
  );
  childCompilation.errors.length = 0;

  compilation.warnings.push(
    ...childCompilation.warnings
  );
  childCompilation.warnings.length = 0;

  return [entries, childCompilation];
};
