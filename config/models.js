const Sequelize = require('sequelize');
const sequelize = require('./database');

const Admins = sequelize.define('admins', {
    ID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    Full_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Phone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    Address: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Date_of_birth: {
        type: Sequelize.DATE,
        allowNull: false
    },
    Date_of_joining: {
        type: Sequelize.DATE,
        allowNull: false
    },
    If_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }, 
    Pwd: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    indexes: [
        {
            name: 'admins_email_index',
            using: 'HASH',
            unique: true,
            fields: ['Email']
        }
    ]
});

const Members = sequelize.define('members', {
    ID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    Full_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Phone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    Address: {
        type: Sequelize.STRING,
        defaultValue: "Not Provided"
    },
    Date_of_membership: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    Pwd: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    indexes: [
        {
            name: 'members_email_index',
            using: 'HASH',
            unique: true,
            fields: ['Email']
        }
    ]
});

const Books = sequelize.define('books', {
    ISBN: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    Title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Author: {
        type: Sequelize.STRING,
        defaultValue: "Unknown"
    },
    Genre: {
        type: Sequelize.STRING,
        defaultValue: "Unknown"
    },
    Year: {
        type: Sequelize.INTEGER,
        defaultValue: null
    },
    Language: {
        type: Sequelize.STRING,
        defaultValue: "English"
    },
    Number_of_copies: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },
    Loaned_copies: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
}, {
    timestamps: false,
    indexes: [
        {
            name: 'books_details_index',
            using: 'BTREE',
            fields: ['Title', 'Author', 'Genre', 'Year', 'Language']
        }
    ]
});

const Loans = sequelize.define('loans', {
    Member_ID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
            model: Members,
            key: 'ID'
        }
    },
    ISBN: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
            model: Books,
            key: 'ISBN'
        }
    },
    Date_of_issue: {
        type: Sequelize.DATE,
        primaryKey: true,
        allowNull: false
    },
    Date_of_return: {
        type: Sequelize.DATE,
    }
}, {timestamps: false});

Books.hasMany(Loans, {foreignKey: 'ISBN'});
Loans.belongsTo(Books, {foreignKey: 'ISBN'});
Members.hasMany(Loans, {foreignKey: 'Member_ID'});
Loans.belongsTo(Members, {foreignKey: 'Member_ID'});

module.exports = {
    Admins,
    Members,
    Books,
    Loans,
    sequelize
};
