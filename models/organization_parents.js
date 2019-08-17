'use strict';
module.exports = (sequelize, DataTypes) => {
  const organization_parents = sequelize.define('organization_parents', {
    org_id: DataTypes.INTEGER,
    parent_id: DataTypes.INTEGER
  }, {});
  organization_parents.associate = function(models) {
    // associations can be defined here
  };
  return organization_parents;
};