'use strict';
module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('organization', {
    org_name: DataTypes.STRING
  }, {});
  Organization.associate = function(models) {
    // associations can be defined here
  };
  return Organization;
};