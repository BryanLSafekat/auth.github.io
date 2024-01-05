import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import {
  Navbar,
  Nav,
  NavDropdown,
  Container,
  Row,
  Col,
  Button,
} from "react-bootstrap";

function App() {
  const [futbolistas, setFutbolistas] = useState([]);
  const [votedUsers, setVotedUsers] = useState([]);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const handleToggle = () => setExpanded(!expanded);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const votedUsersFromStorage = localStorage.getItem("votedUsers");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }

    if (votedUsersFromStorage) {
      setVotedUsers(JSON.parse(votedUsersFromStorage));
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsLoggedIn(true);
    }
  }, [user]);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setUser(codeResponse);
    },
    onError: (error) => console.log("Error al iniciar sesión", error),
  });

  useEffect(() => {
    if (user) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  const logOut = () => {
    googleLogout();
    setProfile(null);
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const fetchFutbolistas = async () => {
      try {
        const response = await axios.get(
          "https://service-api-mzdo.onrender.com/api/futbolistas"
        );
        setFutbolistas(response.data);
      } catch (error) {
        console.log("Error al obtener los datos de la API: ", error);
      }
    };
    fetchFutbolistas();
  }, []);

  const handleVote = async (id) => {
    try {
      
      if (isLoggedIn && !votedUsers.includes(user?.id)) {
        const response = await axios.get(
          `https://service-api-mzdo.onrender.com/api/futbolistas/${id}`
        );
        const currentVotes = response.data.votes || 0;

        await axios.put(`https://service-api-mzdo.onrender.com/api/futbolistas/${id}/votes`, {
          votes: currentVotes + 1,
        });

        const updatedVotedUsers = [...votedUsers, user.id];
        localStorage.setItem("votedUsers", JSON.stringify(updatedVotedUsers));

        setVotedUsers(updatedVotedUsers);
      }
    } catch (error) {
      console.log("Error al votar: ", error);
    }
  };

  return (
    <>
      <Navbar
        bg="dark"
        expand="lg"
        variant="dark"
        expanded={expanded}
        sticky="top"
      >
        <Container>
          <Navbar.Brand href="/">MARCA</Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={handleToggle}
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              {profile ? (
                <NavDropdown title="Cuenta" id="basic-nav-dropdown">
                  <NavDropdown.Item>{profile.name}</NavDropdown.Item>
                  <NavDropdown.Item onClick={logOut}>
                    Cerrar sesión
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link onClick={() => login()}>
                  Iniciar sesión con Google
                </Nav.Link>
              )}
            </Nav>
            <Nav>
              <Nav.Link href="#">About Us</Nav.Link>
              <Nav.Link href="#">Contacto</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <h2 className="text-center mt-4 mb-3">Los 100 Futbolistas</h2>

      <Container>
        <Row>
          {futbolistas.map((futbolista) => (
            <Col key={futbolista.id} md={3} sm={6} xs={12}>
              <div className="player-card bg-light p-3 mb-3 rounded">
                <strong>
                  <p>
                    {futbolista.id}
                    <br />
                    {futbolista.name}
                    <br />
                    Votos: {futbolista.votes}
                  </p>
                </strong>
                <Button
                  className="w-100"
                  variant="outline-primary"
                  onClick={() => handleVote(futbolista.id)}
                  disabled={!isLoggedIn || votedUsers.includes(user?.id)}
                >
                  Votar
                </Button>
              </div>
              <br />
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default App;
