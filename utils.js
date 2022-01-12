exports.cronTime = function cronTime(data) {
  if (!data.start_time && !data.start_time) {
    return;
  }

  let start_time = data.start_time.split(":");
  let stop_time = data.stop_time.split(":");

  return {
    start: `${start_time[1]} ${start_time[0]} * * *`,
    stop: `${stop_time[1]} ${stop_time[0]} * * *`,
  };
};
