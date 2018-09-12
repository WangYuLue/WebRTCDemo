var curry = (fn, arity = fn.length, ...args) => {
    if (arity <= args.length) {
        return fn(...args) 
    } else {
        console.log('===>',...args)
        return curry.bind(null, fn, arity, ...args);
    } 
}
  