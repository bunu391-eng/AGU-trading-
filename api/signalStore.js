const signals=[];
module.exports={
  add(signal){signals.unshift(signal);if(signals.length>100)signals.length=100},
  getAll(){return signals}
};
