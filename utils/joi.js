const Joi = require('joi').extend(require('@joi/date'));

const dateFormats = [
  'YYYY-M-D',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'D-M-YYYY',
  'DD/MM/YYYY',
  'D/M/YYYY',
  'YYYY/MM/DD',
  'YYYY/M/D',
  'YYYY MM DD',
  'YYYY M D',
  'DD MM YYYY',
  'D M YYYY',
  'YYYY.MM.DD',
  'YYYY.M.D',
  'DD.MM.YYYY',
  'D.M.YYYY',
  'DD,MM,YYYY',
  'D,M,YYYY',
  'YYYY,MM,DD',
  'YYYY,M,D',
];

const joiDateSchema = Joi.date().format(dateFormats);

const joiValidate = (date) => {
  return joiDateSchema.validate(date);
};

module.exports = { dateFormats, joiDateSchema, joiValidate };
