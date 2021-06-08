class Failure extends Error {
  constructor(message, code = null){
    super(message);
    if (code) {
      this.code = code;
      this.name = this.constructor.name + ": " + this.code;
    } else {
      this.name = this.constructor.name;
    }
    
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

export { Failure };