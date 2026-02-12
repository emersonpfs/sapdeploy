import paramiko
import winrm
from typing import Callable, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import models
from crud import decrypt_password

executor = ThreadPoolExecutor(max_workers=10)

class DeploymentExecutor:
    """Handle remote deployments via SSH (Linux) and WinRM (Windows)"""
    
    @staticmethod
    def execute_linux_deployment(
        server: models.Server,
        command: str,
        log_callback: Callable[[str], None]
    ) -> tuple[bool, str]:
        """Execute command on Linux server via SSH"""
        try:
            # Decrypt password if using password auth
            password = decrypt_password(server.password) if server.password else None
            
            # Create SSH client
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            log_callback(f"🔌 Connecting to {server.hostname} ({server.ip_address})...\n")
            
            # Connect with SSH key or password
            if server.ssh_key_content:
                # Decrypt and load SSH key from content
                decrypted_key_content = decrypt_password(server.ssh_key_content)
                from io import StringIO
                key_file = StringIO(decrypted_key_content)
                key = paramiko.RSAKey.from_private_key(key_file)
                ssh.connect(
                    hostname=server.ip_address,
                    port=server.port,
                    username=server.username,
                    pkey=key,
                    timeout=10
                )
            else:
                ssh.connect(
                    hostname=server.ip_address,
                    port=server.port,
                    username=server.username,
                    password=password,
                    timeout=10
                )
            
            log_callback(f"✅ Connected successfully!\n")
            log_callback(f"📦 Executing installation command...\n")
            log_callback(f"$ {command}\n\n")
            
            # Execute command
            stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
            
            # Stream output
            full_output = ""
            while True:
                line = stdout.readline()
                if not line:
                    break
                log_callback(line)
                full_output += line
            
            # Check exit status
            exit_status = stdout.channel.recv_exit_status()
            
            # Get error output if any
            error_output = stderr.read().decode('utf-8')
            if error_output:
                log_callback(f"\n⚠️  Errors:\n{error_output}\n")
                full_output += f"\nERROR: {error_output}"
            
            ssh.close()
            
            if exit_status == 0:
                log_callback(f"\n✅ Installation completed successfully on {server.hostname}!\n")
                return True, full_output
            else:
                log_callback(f"\n❌ Installation failed on {server.hostname} (exit code: {exit_status})\n")
                return False, full_output
                
        except paramiko.AuthenticationException:
            error_msg = f"❌ Authentication failed for {server.hostname}"
            log_callback(f"\n{error_msg}\n")
            return False, error_msg
        except paramiko.SSHException as e:
            error_msg = f"❌ SSH error on {server.hostname}: {str(e)}"
            log_callback(f"\n{error_msg}\n")
            return False, error_msg
        except Exception as e:
            error_msg = f"❌ Unexpected error on {server.hostname}: {str(e)}"
            log_callback(f"\n{error_msg}\n")
            return False, error_msg
    
    @staticmethod
    def execute_windows_deployment(
        server: models.Server,
        command: str,
        log_callback: Callable[[str], None]
    ) -> tuple[bool, str]:
        """Execute command on Windows server via WinRM"""
        try:
            # Decrypt password
            password = decrypt_password(server.password) if server.password else None
            
            log_callback(f"🔌 Connecting to {server.hostname} ({server.ip_address})...\n")
            
            # Create WinRM session
            # Default WinRM ports: 5985 (HTTP), 5986 (HTTPS)
            port = server.port if server.port != 22 else 5985
            
            session = winrm.Session(
                f'http://{server.ip_address}:{port}/wsman',
                auth=(server.username, password),
                transport='ntlm'
            )
            
            log_callback(f"✅ Connected successfully!\n")
            log_callback(f"📦 Executing installation command...\n")
            log_callback(f"PS> {command}\n\n")
            
            # Execute PowerShell command
            result = session.run_ps(command)
            
            # Get output
            stdout_output = result.std_out.decode('utf-8')
            stderr_output = result.std_err.decode('utf-8')
            
            log_callback(stdout_output)
            
            if stderr_output:
                log_callback(f"\n⚠️  Errors:\n{stderr_output}\n")
            
            full_output = stdout_output
            if stderr_output:
                full_output += f"\nERROR: {stderr_output}"
            
            if result.status_code == 0:
                log_callback(f"\n✅ Installation completed successfully on {server.hostname}!\n")
                return True, full_output
            else:
                log_callback(f"\n❌ Installation failed on {server.hostname} (exit code: {result.status_code})\n")
                return False, full_output
                
        except Exception as e:
            error_msg = f"❌ WinRM error on {server.hostname}: {str(e)}"
            log_callback(f"\n{error_msg}\n")
            return False, error_msg
    
    @staticmethod
    async def execute_deployment_async(
        server: models.Server,
        application: models.Application,
        log_callback: Callable[[str], None]
    ) -> tuple[bool, str]:
        """Execute deployment asynchronously"""
        loop = asyncio.get_event_loop()
        
        log_callback(f"\n{'='*60}\n")
        log_callback(f"🚀 Starting deployment: {application.name} v{application.version}\n")
        log_callback(f"🖥️  Target: {server.hostname} ({server.os_type.value})\n")
        log_callback(f"{'='*60}\n\n")
        
        if server.os_type == models.OSType.LINUX:
            success, output = await loop.run_in_executor(
                executor,
                DeploymentExecutor.execute_linux_deployment,
                server,
                application.install_command,
                log_callback
            )
        else:  # Windows
            success, output = await loop.run_in_executor(
                executor,
                DeploymentExecutor.execute_windows_deployment,
                server,
                application.install_command,
                log_callback
            )
        
        return success, output
