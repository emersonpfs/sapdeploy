package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"
)

var (
	serverURL string
	token     string
)

type HeartbeatRequest struct {
	Hostname  string `json:"hostname"`
	IPAddress string `json:"ip_address"`
	OSType    string `json:"os_type"`
}

type PendingJob struct {
	ID                int    `json:"id"`
	ApplicationName   string `json:"application_name"`
	InstallCommand    string `json:"install_command"`
	InstallParameters string `json:"install_parameters"`
	IsConsole         bool   `json:"is_console"`
}

type LogAppend struct {
	Logs string `json:"logs"`
}

type StatusUpdate struct {
	Status       string `json:"status"`
	ErrorMessage string `json:"error_message,omitempty"`
}

func doRequest(method, path string, body interface{}) (*http.Response, error) {
	var bodyReader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewBuffer(data)
	}
	req, err := http.NewRequest(method, serverURL+path, bodyReader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Agent-Token", token)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 15 * time.Second}
	return client.Do(req)
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "unknown"
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.To4() != nil {
			return ipnet.IP.String()
		}
	}
	return "unknown"
}

func sendHeartbeat() {
	hostname, _ := os.Hostname()
	osType := "linux"
	if runtime.GOOS == "windows" {
		osType = "windows"
	}
	resp, err := doRequest("POST", "/api/agent/heartbeat", HeartbeatRequest{
		Hostname:  hostname,
		IPAddress: getLocalIP(),
		OSType:    osType,
	})
	if err != nil {
		log.Printf("Heartbeat error: %v", err)
		return
	}
	resp.Body.Close()
}

func pollJob() *PendingJob {
	resp, err := doRequest("GET", "/api/agent/jobs/pending", nil)
	if err != nil {
		log.Printf("Poll error: %v", err)
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode == 204 {
		return nil
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil || string(data) == "null" || len(data) == 0 {
		return nil
	}
	var job PendingJob
	if err := json.Unmarshal(data, &job); err != nil {
		return nil
	}
	return &job
}

func sendLog(jobID int, logText string) {
	resp, err := doRequest("POST", fmt.Sprintf("/api/agent/jobs/%d/logs", jobID), LogAppend{Logs: logText})
	if err == nil {
		resp.Body.Close()
	}
}

func updateStatus(jobID int, status string, errMsg string) {
	resp, err := doRequest("PATCH", fmt.Sprintf("/api/agent/jobs/%d/status", jobID), StatusUpdate{
		Status:       status,
		ErrorMessage: errMsg,
	})
	if err == nil {
		resp.Body.Close()
	}
}

func executeJob(job *PendingJob) {
	if job.IsConsole {
		log.Printf("Console job %d: %s", job.ID, job.InstallCommand)
	} else {
		log.Printf("Executing job %d: %s", job.ID, job.ApplicationName)
	}
	updateStatus(job.ID, "running", "")

	command := job.InstallCommand
	if !job.IsConsole && job.InstallParameters != "" {
		command = command + " " + job.InstallParameters
	}

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("powershell", "-Command", command)
	} else {
		cmd = exec.Command("bash", "-c", command)
	}

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		updateStatus(job.ID, "failed", err.Error())
		return
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		updateStatus(job.ID, "failed", err.Error())
		return
	}

	buf := make([]byte, 1024)
	for {
		n, readErr := stdoutPipe.Read(buf)
		if n > 0 {
			chunk := string(buf[:n])
			fmt.Print(chunk)
			sendLog(job.ID, chunk)
		}
		if readErr != nil {
			break
		}
	}

	if err := cmd.Wait(); err != nil {
		updateStatus(job.ID, "failed", err.Error())
		log.Printf("Job %d failed: %v", job.ID, err)
	} else {
		updateStatus(job.ID, "success", "")
		log.Printf("Job %d completed successfully", job.ID)
	}
}

func main() {
	flag.StringVar(&serverURL, "server", "", "DeployMaster server URL (e.g. http://192.168.1.10:9090)")
	flag.StringVar(&token, "token", "", "Agent token")
	flag.Parse()

	if serverURL == "" {
		serverURL = os.Getenv("DEPLOYMASTER_SERVER")
	}
	if token == "" {
		token = os.Getenv("DEPLOYMASTER_TOKEN")
	}
	if serverURL == "" || token == "" {
		log.Fatal("--server and --token are required (or set DEPLOYMASTER_SERVER / DEPLOYMASTER_TOKEN env vars)")
	}

	log.Printf("DeployMaster Agent starting -> %s", serverURL)

	sendHeartbeat()

	heartbeatTicker := time.NewTicker(10 * time.Second)
	pollTicker := time.NewTicker(10 * time.Second)
	defer heartbeatTicker.Stop()
	defer pollTicker.Stop()

	for {
		select {
		case <-heartbeatTicker.C:
			sendHeartbeat()
		case <-pollTicker.C:
			job := pollJob()
			if job != nil {
				go executeJob(job)
			}
		}
	}
}
