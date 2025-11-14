import { createContext, useContext, useState } from "react";
import { useSelector } from "react-redux";

const AuthContext = createContext({
    user: null,
    token: null,
    schema: null,
    setUser: () => { },
    setToken: () => { },
    setWorkSpace: () => { }
})

export const ContextProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, _setToken] = useState(localStorage.getItem('ACCESS_TOKEN'))
    // const [schema, _setSchema] = useState(localStorage.getItem('SCHEMA'))
    const [work_space, _setWrokSpace] = useState(localStorage.getItem('X-Workspace-Key'))
    function setToken(token) {
        _setToken(token)
        if (token) {
            localStorage.setItem('ACCESS_TOKEN', token)
        } else {
            localStorage.removeItem('ACCESS_TOKEN')
        }
    }

    function setWorkSpace(work_space) {
        _setWrokSpace(work_space.id)
        _setWrokSpace(work_space.type)
        if (work_space) {
            localStorage.setItem('X-Workspace-Key', work_space.id)
            localStorage.setItem('X-Workspace-Type', work_space.type)
        } else {
            localStorage.removeItem('X-Workspace-Key')
            localStorage.removeItem('X-Workspace-Type')
        }
    }

    return <>
        <AuthContext.Provider value={{ user, setUser, token, setToken, work_space, setWorkSpace }}>
            {children}
        </AuthContext.Provider>
    </>
}
export const useAuthContext = () => useContext(AuthContext)