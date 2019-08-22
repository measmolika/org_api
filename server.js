var app = require('express')();
var url = require('url');
var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql://dev:dev@127.0.0.1:3306/devdb',{
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


function parseJson(json) {
	var organizations = {};

	function do_parse_json(json) {
		if (!(json.org_name in organizations))
			organizations[json.org_name] = [];

		if (json.daughters) {
			for (var daughter of json.daughters) {
				organizations[json.org_name].push(daughter.org_name);
				do_parse_json(daughter);
			}
		}
		return organizations;
	}
	return do_parse_json(json);
}


function insertOrg(json, parent_id = null) {
	var organizations = parseJson(json);

	var org_ids = {};
	var promises = [];

	for (var org_name in organizations) {
		promises.push(Organization.create({ org_name: org_name }).then(org => {
			org_ids[org.org_name] = org.id;
		}));
	}

	Promise.all(promises).then(() => {
		promises = [];
		for (var org_name in organizations) {
			for (var daughter_name of organizations[org_name]) {
				promises.push(OrganizationParent.create({
					org_id: org_ids[daughter_name],
					parent_id: org_ids[org_name]
				}));
			}
		}
	});

	return Promise.all(promises);


	/*return Organization.findOrCreate({ where: {org_name: json.org_name} })
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
			}
		});*/
}

function search(array, name) {
	for(var arr in array) {
		if(array[arr].org_name===name)
			return true;
	}
}

function findRelatives(name){
	return new Promise(function(resolve,reject){
		var list = [];
		var orgName;
		Organization.findOne({
			where: { org_name: name }
		}).then(function(org) {
			orgName = org.org_name;
			org.getParents().then(parents => {
				var promises = [];
				for(var parent in parents) {
					var pname = parents[parent].org_name;
					list.push({"relationship_type":"parent","org_name":pname});
					promises.push(parents[parent].getDaughters().then(sisters => {
						for(var sister in sisters) {
							var sname = sisters[sister].org_name;
							if((!search(list,sname)) && sname!=orgName)				
								list.push({"relationship_type":"sister","org_name":sname});
						}
					}));
				}
				org.getDaughters().then(daughters => {
					for(var daughter in daughters) {
						var dname = daughters[daughter].org_name;
						list.push({"relationship_type":"daughter","org_name":dname});
					}
					Promise.all(promises).then(() => {
						list.sort((a,b) => (a.org_name > b.org_name) ? 1 : -1); 
						resolve(list);
					});
				});
			});
		});
	});
}

app.use(bodyParser.json());

app.get('/', function (req, res) {
	var org_name = url.parse(req.url,true).query.name;
	var page_nr = url.parse(req.url,true).query.page_nr;
	findRelatives(org_name).then(data => {
		var startAt = (page_nr-1)*100;
		var endAt = page_nr*100;
		res.send(JSON.stringify(data.slice(startAt,endAt), null, 4));
	});
});
app.post('/', (req, res) => {
	var json = req.body;
	insertOrg(json).then(() => {
		res.send('relations created successfully.\n');
	});
});
app.listen(8080);
console.log(`Running on port 8080\n`);
