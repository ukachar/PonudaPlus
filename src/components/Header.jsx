import React, { useEffect, useState } from "react";
import getUserInfo from "../../helpers/getUserInfo";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [fullName, setFullName] = useState(null);
  const [initials, setInitials] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getUserInfo();
        setFullName(user.name);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const getInitials = (name) => {
      if (!name || typeof name !== "string") return "";
      setInitials(
        name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
      );
    };

    fullName && getInitials(fullName);
  }, [fullName]);

  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link to="/dashboard" className="btn btn-ghost text-xl">
          Ponuda+
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link to="/dashboard" className="btn btn-ghost">
          Početna
        </Link>
        <Link to="/ponude" className="btn btn-ghost">
          Ponude
        </Link>

        <Link to="/prijem" className="btn btn-ghost">
          Prijem
        </Link>
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar "
          >
            <div className="w-10 rounded-full !flex items-center justify-center ">
              <div className="text-center ">{initials}</div>
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-200 rounded z-[1] mt-3 w-52 p-2 shadow"
          >
            <p className="font-bold text-xl text-center">{fullName}</p>
            <hr className="h-px my-2 bg-gray-200 border-0 dark:bg-gray-700" />
            <li>
              <Link to="/settings">Postavke</Link>
            </li>
            <li>
              <div onClick={handleLogout}>Odjava</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
