describe('wait for reload', function() {
    it('waits', function() {
        cy.wait(200);
    });
});

describe('/api', function() {
    it('Says hello world', function() {
        cy.visit('/api');

        cy.get('body').contains('hello calhacks 2018');
    });
});

describe('/api/auth', function() {
    it ('Authenticates with firebase', function() {
        cy.visit('/api/auth', {failOnStatusCode: false});

        cy.get('body').contains('Wrong method');
    });
});
