var app = require('express')();
var url = require('url');
var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql://dev:dev@127.0.0.1:3306/devdb2',{
	define: { timestamps: false }
});
var bodyParser = require('body-parser'); 
const Organization = sequelize.define('organization',{
	org_name: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

const OrganizationParent = sequelize.define('organization_parents',{
	org_id: {
		type: Sequelize.INTEGER,
		allowNull: false,
	}, 
	parent_id: {
		type: Sequelize.INTEGER,
		allowNull: true,
	}
});

Organization.belongsToMany(Organization, {
	through: OrganizationParent,
	as: 'Daughters',
	foreignKey: 'parent_id',
});

Organization.belongsToMany(Organization, {
	through: OrganizationParent,
	as: 'Parents',
	foreignKey: 'org_id',
});

function insertOrg(json, parent_id = null) {
	return new Promise(function(resolve,reject){
		Organization.findOrCreate({ where: {org_name: json.org_name} })
			.then(([org]) => {		
				console.log(org);
				OrganizationParent.create({
					org_id: org.id, parent_id: parent_id
				}).then(orgParent => {
					console.log("Parent Auto-generated ID: ", orgParent.id);
				});
				if (json.daughters) {
					for (var i=0; i<json.daughters.length; i++) {
						insertOrg(json.daughters[i], org.id);
					}
					resolve();
				}
			});
	});
}

function search(arr, name) {
	for(var i=0; i<arr.length; i++) {
		if(arr[i].org_name===name)
			return true;
	}
}

function findRelatives(name){
	return new Promise(function(resolve,reject){
		let list = [];
		Organization.findOne({
			where: { org_name: name }
		}).then(function(org) {
			org.getParents().then(parents => {
				for(var i=0; i<parents.length; i++) {
					list.push({"relationship_type":"parent","org_name":parents[i].dataValues.org_name});
					parents[i].getDaughters().then(sisters => {
						for(var i=0; i<sisters.length; i++) {
							if(!search(list,sisters[i].dataValues.org_name))					
								list.push({"relationship_type":"sister","org_name":sisters[i].dataValues.org_name});
						}
					});
				}
				org.getDaughters().then(daughters => {
					for(var i=0; i<daughters.length; i++) {
						list.push({"relationship_type":"daughter","org_name":daughters[i].dataValues.org_name});
					}
					list.sort((a,b) => (a.org_name > b.org_name) ? 1 : -1); 
					resolve(list);
				});
			});
		});
	});
}

app.use(bodyParser.json());

app.get('/', function (req, res) {
	var org_name = url.parse(req.url,true).query.name;
	findRelatives(org_name).then(data => {
		res.send(data);
	});
});
app.post('/', (req, res) => {
	var json = req.body;
	insertOrg(json).then(data => {
		res.send('relations created successfully.');
	});
});
app.listen(8080);
console.log(`Running on port 8080`);
