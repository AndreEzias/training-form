// src/components/Header.tsx
import React from 'react';
import Link from 'next/link';
import {Navbar, Nav} from 'react-bootstrap';

const Header: React.FC = () => {
    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Navbar.Brand href="/">Training Form</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav"/>
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link as={Link} href="/">Home</Nav.Link>
                    <Nav.Link as={Link} href="/saved-workouts">Treinos Salvos</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default Header;