---
title:    Raspberry Pi Storage Throughput Testing
modified: 2021-01-09T21-50-00+00.00
---

# {{ page.title }}
### (aka where to persist data when building a Pi Kubernetes cluster)

## TL;DR

Having tested various options, I'll be using **** as the permanent backing store for my Raspberry Pi Kubernetes cluster workloads and **** for working storage.


## Test setup

%%% INSERT drawing.net picture here %%%

I use:
* a "server" (2GB) and a "client" (8GB) [Raspberry Pi 4 Model B](https://www.raspberrypi.org/products/raspberry-pi-4-model-b/specifications/) 
* the Pis are running off a microSD Card on either a
  * [SanDisk Ultra 32GB U1 Class 10 ](https://shop.westerndigital.com/en-gb/products/memory-cards/sandisk-ultra-uhs-i-microsd#SDSQUA4-032G-GN6MA)
  * [Samsung EVO Plus 64GB Grade3(U3) Class 10](https://www.samsung.com/uk/memory-storage/memory-card/evo-plus-microsd-card-with-sd-adapter-64gb-mb-mc64ga-eu/)
* ... and using one of
  * Raspberry Pi OS Lite (32-bit)
  * Raspberry Pi OS (64-bit) beta (no lite version available)
  * Ubuntu Server 20.04.1 LTS (32-bit)
  * Ubuntu Server 20.04.1 LTS (64-bit)
* ... and both without and with (Ubuntu only) [iscsi iSER](https://en.wikipedia.org/wiki/ISCSI_Extensions_for_RDMA)
* The server Pi has a [Kingston 120GB M.2 SSD](https://www.kingston.com/unitedkingdom/en/memory/search/discontinuedmodels?partId=SUV500M8%2F120G) attached to it via either a:
  * [Geekwork X862 M.2 SSD USB 3.1 adapter "shield"](https://geekworm.com/products/for-raspberry-pi-4-x862-m-2-ngff-sata-ssd-storage-expansion-board)
  * [Sabrent M.2 SSD [NGFF] USB 3.0 aluminum Enclosure](https://www.sabrent.com/product/EC-M2MC/m-2-ssd-ngff-to-usb-3-0-aluminum-enclosure)
* the pis are linked together via a [Netgear GS305 gigabit switch](https://www.netgear.co.uk/images/datasheet/switches/GS305_GS308_GS305P_GS308P.pdf)
* the pi network is then linked to a NAS via a [Netgear GS308 gigabit switch](https://www.netgear.co.uk/images/datasheet/switches/GS305_GS308_GS305P_GS308P.pdf)
* the NAS is a [Synology DS415+](https://global.download.synology.com/download/Document/Hardware/DataSheet/DiskStation/15-year/DS415+/enu/Synology_DS415_Plus_Data_Sheet_enu.pdf) with a 3x [Seagate Ironwolf 7200rpm 6TB](https://www.seagate.com/gb/en/internal-hard-drives/hdd/ironwolf/) raid backing store

## Trying it out yourself

> :information_source: Familiarity with ansible itself is required to run this, it won't be detailed here.

> :information_source: First, make sure to get some fresh microSD cards for the Pis, there's not automatic rollback to the "before" state, and shutdown seems to be problematic after installing this due to the iscsi mounts.  You have been cautioned!


Once clean cards are installed, OS-specific setup steps are needed:

### Raspberry Pi OS Setup

Login to each pi using the default username `pi`, password `raspberry`, then allow ssh login by doing:

```bash
sudo touch /boot/ssh
sudo reboot
```

### Ubuntu Setup

Login to each pi using the default username `ubuntu`, password `ubuntu`.

Change the password when prompted (suggest `raspberry` for ease of interop with Raspberry Pi OS test setups)

### SSH setup

Ensure that the ansible `hosts` file has the correct username and password for each pi.

Clear out ssh host key cache on ansible host machine by doing:

```bash
ssh-keygen -R {pi-ip-address}
```
Update the ECSDA key fingerprint by doing:
```bash
ssh {pi-ip-address}
...
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

There's no need to actually do the ssh login after this, ansible is now good to go.


## Ansible Setup

### Ansible config

To test on Rasperry Pi OS x64 (as of Jan 2021), ensure the following section is in your `~/.ansible.cfg`:

```config
[ssh_connection]
scp_if_ssh=True
```

### Ansible role

The ansible role is at https://github.com/Kolossi/ansible-role-utils, and an [example playbook](https://github.com/Kolossi/ansible-role-utils/blob/main/use_cases/pi-throughput-test.yml) is provided.

Be sure to change the playbook vars header:
```yaml
- vars:
    ssd_pi_hostname:      "CHANGE_ME: server pi (with ssd) hostname known to ansible :CHANGE_ME"
    client_pi_hostname:   "CHANGE_ME: client pi hostname known to ansible hosts file :CHANGE_ME"
    nas_nfs_target:       "CHANGE_ME: nas nfs target ({ip address}:{path}) :CHANGE_ME"
    nas_iscsi_target_iqn: "CHANGE_ME: nas iscsi target iqn :CHANGE_ME"
    nas_iscsi_target_ip:  "CHANGE_ME: nas iscsi target ip address :CHANGE_ME"
    pi_nfs_serve_network: "CHANGE_ME: an ip network spec that includes server & client pis :CHANGE_ME"
    test_dir:             "CHANGE_ME: dir on pi to use for workings (e.g. /media/test) :CHANGE_ME"
    ssd_device:           "CHANGE_ME: pi ssd device (e.g. /dev/sda) :CHANGE_ME"
    pi_ntp_servers:       "CHANGE_ME: space-separated ntp servers :CHANGE_ME"
```

Then run with

```bash
ansible-playbook ./pi-throughput-test.yml
```

... and then wait ... :clock1: ... about an hour! 

The ansible output will end with a message giving the local temp filename that the results are stored in.