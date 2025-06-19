// Permission System Test Utilities
// Run these commands in the browser console to test the permission system

console.log('🔐 Permission System Test Utils Loaded');

// Test current user permissions
function testUserPermissions() {
    console.log('\n🧪 Testing User Permissions...');
    console.log('User ID:', collaborationState.userId);
    console.log('Connected to session:', collaborationState.isConnected);
    console.log('Is host:', collaborationState.isHost);
    console.log('Current session ID:', collaborationState.currentSessionId);
    
    // Test items in each category
    ['well', 'improve', 'action'].forEach(category => {
        const items = retroData.items[category];
        console.log(`\n${category.toUpperCase()} Column (${items.length} items):`);
        
        items.forEach((item, index) => {
            const canEdit = canEditItem(item);
            const isOwn = item.createdBy && item.createdBy.userId === collaborationState.userId;
            
            console.log(`  ${index + 1}. "${item.text.substring(0, 30)}${item.text.length > 30 ? '...' : ''}"`);
            console.log(`     Created by: ${item.createdBy ? item.createdBy.userId : 'Unknown'}`);
            console.log(`     Can edit: ${canEdit ? '✅' : '❌'}`);
            console.log(`     Is own item: ${isOwn ? '✅' : '❌'}`);
        });
    });
}

// Test permission enforcement
function testPermissionEnforcement() {
    console.log('\n🛡️ Testing Permission Enforcement...');
    
    // Find an item created by someone else
    let otherUserItem = null;
    let category = null;
    
    for (const cat of ['well', 'improve', 'action']) {
        const item = retroData.items[cat].find(item => 
            item.createdBy && 
            item.createdBy.userId !== collaborationState.userId
        );
        if (item) {
            otherUserItem = item;
            category = cat;
            break;
        }
    }
    
    if (otherUserItem) {
        console.log(`Found other user's item: "${otherUserItem.text.substring(0, 50)}..."`);
        console.log('Testing edit permission...');
        
        try {
            editItem(otherUserItem.id, category);
            console.log('❌ ERROR: Should not be able to edit other user\'s item!');
        } catch (error) {
            console.log('✅ Good: Edit permission properly blocked');
        }
        
        console.log('Testing delete permission...');
        try {
            deleteItem(otherUserItem.id, category);
            console.log('❌ ERROR: Should not be able to delete other user\'s item!');
        } catch (error) {
            console.log('✅ Good: Delete permission properly blocked');
        }
    } else {
        console.log('ℹ️ No items from other users found to test permissions');
    }
}

// Test visual indicators
function testVisualIndicators() {
    console.log('\n👁️ Testing Visual Indicators...');
    
    const items = document.querySelectorAll('.item');
    console.log(`Found ${items.length} item elements in DOM`);
    
    let ownItems = 0;
    let otherItems = 0;
    let readonlyItems = 0;
    let itemsWithOwnershipIcons = 0;
    
    items.forEach((itemEl, index) => {
        const hasOwnershipIcon = itemEl.querySelector('.ownership-indicator');
        const isReadonly = itemEl.classList.contains('item-readonly');
        const hasEditButton = itemEl.querySelector('.edit-btn');
        const hasDeleteButton = itemEl.querySelector('.delete-btn');
        
        if (hasOwnershipIcon) {
            ownItems++;
            itemsWithOwnershipIcons++;
        }
        
        if (isReadonly) {
            readonlyItems++;
            otherItems++;
        }
        
        console.log(`Item ${index + 1}:`);
        console.log(`  Has ownership icon: ${hasOwnershipIcon ? '✅' : '❌'}`);
        console.log(`  Is readonly: ${isReadonly ? '✅' : '❌'}`);
        console.log(`  Has edit button: ${hasEditButton ? '✅' : '❌'}`);
        console.log(`  Has delete button: ${hasDeleteButton ? '✅' : '❌'}`);
    });
    
    console.log(`\nSummary:`);
    console.log(`  Own items (with blue icons): ${ownItems}`);
    console.log(`  Other users' items (readonly): ${otherItems}`);
    console.log(`  Items with ownership indicators: ${itemsWithOwnershipIcons}`);
}

// Create test items for permission testing
function createTestItems() {
    console.log('\n🧪 Creating Test Items...');
    
    if (!collaborationState.isConnected) {
        console.log('❌ Not in collaborative mode - cannot test permissions properly');
        return;
    }
    
    // Add test items to each column
    const testItems = [
        { category: 'well', text: 'Permission Test Item - What Went Well' },
        { category: 'improve', text: 'Permission Test Item - Could Improve' },
        { category: 'action', text: 'Permission Test Item - Action Item' }
    ];
    
    testItems.forEach(({ category, text }) => {
        const input = document.getElementById(category + 'Input');
        input.value = text;
        addItem(category);
        console.log(`✅ Added test item to ${category} column`);
    });
    
    console.log('🎯 Test items created! They should have blue ownership icons.');
}

// Run full permission test suite
function runFullPermissionTest() {
    console.log('🚀 Running Full Permission Test Suite...\n');
    
    testUserPermissions();
    testVisualIndicators();
    testPermissionEnforcement();
    
    console.log('\n✅ Permission test suite completed!');
    console.log('Check the output above for any issues.');
}

// Export functions to global scope
window.testUserPermissions = testUserPermissions;
window.testPermissionEnforcement = testPermissionEnforcement;
window.testVisualIndicators = testVisualIndicators;
window.createTestItems = createTestItems;
window.runFullPermissionTest = runFullPermissionTest;

console.log('\n📋 Available Test Functions:');
console.log('- testUserPermissions(): Check current user permissions');
console.log('- testPermissionEnforcement(): Test that permissions are enforced');
console.log('- testVisualIndicators(): Check visual ownership indicators');
console.log('- createTestItems(): Create test items for permission testing');
console.log('- runFullPermissionTest(): Run complete test suite');
console.log('\n💡 Usage: Just type the function name in console, e.g.: testUserPermissions()');
