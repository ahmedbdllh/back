const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import the Company model
const Company = require('../models/Company');

const cleanupOrphanedCompanies = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportify-companies');
    console.log('Connected to MongoDB');

    // Get all companies
    const companies = await Company.find();
    console.log(`Found ${companies.length} companies to check`);

    const orphanedCompanies = [];
    const validCompanies = [];

    // Check each company's owner in the auth service
    for (const company of companies) {
      if (!company.ownerId) {
        console.log(`Company ${company.companyName} has no ownerId - keeping it`);
        validCompanies.push(company);
        continue;
      }

      try {
        // Check if user exists in auth service
        const userResponse = await axios.get(`http://localhost:5000/api/auth/user/${company.ownerId}`);
        
        if (userResponse.data && userResponse.data.user) {
          console.log(`✅ Company "${company.companyName}" - Owner "${userResponse.data.user.fullName}" exists`);
          validCompanies.push(company);
        } else {
          console.log(`❌ Company "${company.companyName}" - Owner data not found in response`);
          orphanedCompanies.push(company);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`❌ Company "${company.companyName}" - Owner ${company.ownerId} not found (404)`);
          orphanedCompanies.push(company);
        } else {
          console.log(`⚠️  Error checking owner for company "${company.companyName}": ${error.message}`);
          validCompanies.push(company); // Keep companies where we can't verify due to network issues
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Valid companies: ${validCompanies.length}`);
    console.log(`Orphaned companies: ${orphanedCompanies.length}`);

    if (orphanedCompanies.length > 0) {
      console.log('\n🗑️  ORPHANED COMPANIES TO DELETE:');
      orphanedCompanies.forEach(company => {
        console.log(`- ${company.companyName} (Owner ID: ${company.ownerId})`);
      });

      // Ask for confirmation (you'll need to modify this for actual deletion)
      console.log('\n⚠️  To delete these orphaned companies, uncomment the deletion code below');
      
      // UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE THE ORPHANED COMPANIES
      /*
      const deleteResult = await Company.deleteMany({
        _id: { $in: orphanedCompanies.map(c => c._id) }
      });
      console.log(`\n✅ Deleted ${deleteResult.deletedCount} orphaned companies`);
      */
    }

    await mongoose.disconnect();
    console.log('\n✅ Cleanup process completed');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await mongoose.disconnect();
  }
};

// Run the cleanup
cleanupOrphanedCompanies();
