import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { Navbar, Nav, Button } from "react-bootstrap";

function App() {
  const [futbolistas, setFutbolistas] = useState([]);
  const [votedUsers, setVotedUsers] = useState([]);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }

    const votedUsersFromStorage = localStorage.getItem("votedUsers");
    if (votedUsersFromStorage) {
      setVotedUsers(JSON.parse(votedUsersFromStorage));
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    localStorage.setItem("votedUsers", JSON.stringify(votedUsers));
  }, [user, votedUsers]);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
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
          "http://localhost:8080/api/futbolistas"
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
          `http://localhost:8080/api/futbolistas/${id}`
        );
        const currentVotes = response.data.votes || 0;

        const updatedFutbolistas = futbolistas.map((futbolista) =>
          futbolista.id === id
            ? { ...futbolista, votes: futbolista.votes + 1 }
            : futbolista
        );

        setFutbolistas(updatedFutbolistas);

        setVotedUsers([...votedUsers, user.id]);

        await axios.put(`http://localhost:8080/api/futbolistas/${id}/votes`, {
          votes: currentVotes + 1,
        });
      } else {
        console.log("Debes iniciar sesión para votar o ya has votado.");
      }
    } catch (error) {
      console.log("Error al votar: ", error);
    }
  };

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="/">MARCA </Navbar.Brand>
        <Nav>
          <div className="user-profile">
            {profile ? (
              <>
                <img src={profile.picture} alt="User profile" />
                <div className="user-details">
                  <h3>Sesión Iniciada</h3>
                  <p>
                    <strong>Nombre: </strong>
                    {profile.name}
                  </p>
                  <p>
                    <strong>Correo: </strong>
                    {profile.email}
                  </p>
                  <Button onClick={logOut}>Log out</Button>
                </div>
              </>
            ) : (
              <Button onClick={() => login()}>Sign in with Google</Button>
            )}
          </div>
        </Nav>
      </Navbar>

      <h2>Futbolistas</h2>
      <ul>
        {futbolistas.map((futbolista) => (
          <li key={futbolista.id}>
            {futbolista.id} - {futbolista.name} - Votos: {futbolista.votes}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button
              onClick={() => handleVote(futbolista.id)}
              disabled={!isLoggedIn || votedUsers.includes(user?.id)}
            >
              Votar
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
