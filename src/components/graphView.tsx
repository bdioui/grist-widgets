import { useState, useEffect } from "react"
import type { Project, ProjectPartner } from "@/lib/types"
import { getProjects, getProjectPartners } from "@/lib/api"

export default function Graph({} : {}) {
    const [projects, setProjects] = useState<Project[]>([])
    const [projectPartners, setProjectPartners] = useState<ProjectPartner[]>([])
    useEffect(() =>{
        Promise.all([getProjects(), getProjectPartners()])
        .then(([p, pp])=> {
            setProjects(p)
            setProjectPartners(pp)
        })
    }, [])
    return (
        <canvas></canvas>
    )
}