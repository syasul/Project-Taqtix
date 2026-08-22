allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

subprojects {
    val configureAndroid: Project.() -> Unit = {
        if (hasProperty("android")) {
            extensions.configure<com.android.build.gradle.BaseExtension>("android") {
                if (namespace == null) {
                    namespace = project.group.toString()
                }
            }
        }
    }
    if (state.executed) {
        configureAndroid()
    } else {
        afterEvaluate {
            configureAndroid()
        }
    }
}

subprojects {
    if (project.name != "app") {
        val configureCompileSdk: Project.() -> Unit = {
            if (project.plugins.hasPlugin("com.android.application") || 
                project.plugins.hasPlugin("com.android.library")) {
                val android = project.extensions.findByName("android") as? com.android.build.gradle.BaseExtension
                android?.compileSdkVersion(35)
            }
        }
        if (state.executed) {
            configureCompileSdk()
        } else {
            afterEvaluate {
                configureCompileSdk()
            }
        }
    }
}

