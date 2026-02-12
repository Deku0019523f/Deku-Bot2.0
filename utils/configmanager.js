import fs from 'fs';
const configPath = './database/users.json';
const premiumPath = './database/premiums.json';

const configmanager = {
    config: fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : { users: {} },
    premiums: fs.existsSync(premiumPath) ? JSON.parse(fs.readFileSync(premiumPath)) : { premiumUser: {} },

    save: () => fs.writeFileSync(configPath, JSON.stringify(configmanager.config, null, 2)),
    saveP: () => fs.writeFileSync(premiumPath, JSON.stringify(configmanager.premiums, null, 2))
};

export default configmanager;