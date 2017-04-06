VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = "ubuntu/trusty64"
  config.vm.network "private_network", ip: "192.168.233.100"
  config.vm.network :forwarded_port, guest: 6379, host: 6379

  config.vm.provider :virtualbox do |vbox|
    vbox.customize ["modifyvm", :id, "--memory", 512]
  end

  config.vm.provision :shell, :path => "./provision/init.sh"
end