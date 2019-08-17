var app = require('express')();
// setting sequelize connection
var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql://dev:dev@localhost:3306/devdb1',{
	define: {
		timestamps: false
	}
});
var bodyParser = require('body-parser');  

// model the table
const Organization = sequelize.define('organization',{
	org_name: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

const OrganizationParent = sequelize.define('organization_parents',{
	org_id: {
		type: Sequelize.INTEGER,
		allowNull: false
	}, 
	parent_id: {
		type: Sequelize.INTEGER,
		allowNull: true
	}
});


function makeStruct(json, parent_id = null) {
	Organization.create({
		org_name: json.org_name
	}).then(org => {
		console.log("New Auto-generated id", org.id);
		
		OrganizationParent.create({
			org_id: org.id, parent_id: parent_id
		}).then(orgParent => {
			console.log("orgParent Auto-generated ID: ", orgParent.id);
		});
		if (json.daughters) {
			for (var i=0; i<json.daughters.length; i++) {
				makeStruct(json.daughters[i], org.id);
			}
		}
	});
	
}

//var json = {"org_name":"org_1","daughters":[{"org_name":"org_sub_1","daughters":[{"org_name":"child_1"},{"org_name":"child_2"}]}]};
var json = {
	org_name: "Org_main_1",
	daughters: [{
		org_name: "Org_sub_1",
		daughters: [{
			org_name: "Org_child_1"
		},{
			org_name: "Org_child_2"
		},{
			org_name: "Org_child_3"
		}]
	},{
		org_name: "Org_sub_2",
		daughters: [{
			org_name: "Org_child_1"
		},{
			org_name: "Org_child_2"
		},{
			org_name: "Org_child_6",
			daughters: [{
				org_name: "Org_child_sub_1"
			}]
		}]
	}]
};

makeStruct(json);

// app.use(bodyParser.json());
// app.post('/',function(req,res){
// 	console.log(req.body);
// 	res.end();
// });

app.listen(8080);
console.log(`Running on localhost:8080`);
